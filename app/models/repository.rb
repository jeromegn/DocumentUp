class Repository < ActiveRecord::Base
  has_many :pages
  after_create :refresh

  serialize :config, Repository::Configuration

  def tree
    @tree ||= Octokit.tree(full_name, branch, recursive: true)
  end

  def name
    full_name.split("/").last
  end
  def display_name
    config.name || name
  end

  def login
    full_name.split("/").first
  end

  def github_url
    "https://github.com/#{full_name}"
  end
  def github_issues_url
    "https://github.com/#{full_name}/issues"
  end
  def travis_url
    "http://travis-ci.org/#{full_name}"
  end
  def travis_image_url
    "https://travis-ci.org/#{full_name}.svg?branch=#{branch}"
  end

  def refresh_config
    file = tree.tree.detect do |obj|
      obj[:type] == 'blob' && !(obj[:path] =~ /\A.{0,1}documentup.(json|yml|yaml)/).nil?
    end
    config = if file.present?
      path = file[:path]
      contents = Octokit.contents(full_name, path: path, accept: 'application/vnd.github.raw')
      if path.ends_with?('yml') || path.ends_with?('yaml')
        YAML.load(contents)
      elsif path.ends_with?('json')
        JSON.parse(contents)
      end
    else
      {}
    end
    self.config = Repository::Configuration.new(config)
  end

  def find_in_tree(path)
    path = 'readme' if path.blank?
    tree.tree.detect do |obj|
      obj[:type] == 'blob' && !(obj[:path] =~ /(#{path}(?:\/README)?)\.(md|mdown|markdown)\z/i).nil?
    end
  end

  def page_source(path)
    if found = find_in_tree(path)
      Octokit.contents(full_name, path: found[:path], accept: 'application/vnd.github.raw')
    else
      false
    end
  end

  def refresh
    response = Octokit.repository(full_name)
    self.full_name = response.full_name
    self.branch = response.default_branch
    refresh_config
    save
  end

end