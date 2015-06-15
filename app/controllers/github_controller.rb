class GithubController < ActionController::Base
  def push
    return render nothing: true unless commits?
    current_repository.refresh if reconfig?
    to_recompile.each do |filename|
      page = Page.find_or_create_by(repository: current_repository, path: filename)
      page.refresh
    end
    render nothing: true
  end

  private

  def current_repository
    @current_repository ||= Repository.find_or_create_by(full_name: payload.repository.full_name.downcase)
  end

  def payload
    @payload ||= Sawyer::Resource.new(Octokit.client.agent, params[:payload])
  end

  def commits
    @commits ||= payload.commits
  end

  def added_filenames
    commits.flat_map(&:added)
  end

  def modified_filenames
    commits.flat_map(&:modified)
  end

  def filenames
    @filenames ||= (added_filenames + modified_filenames).uniq
  end

  def commits?
    commits.present?
  end

  def reconfig?
    filenames.any? { |f| !(f =~ /\A\.{0,1}documentup\.(json|yml|yaml)\Z/i).nil? }
  end

  def to_recompile
    filenames.select {|f| !(f =~ /((?:\/README)?)\.(md|mdown|markdown)\Z/i).nil? }
  end
end