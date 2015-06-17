require 'task_list/filter'

class Page < ActiveRecord::Base
  belongs_to :repository

  before_create :fetch_source

  after_save :parse, if: :source_changed?

  def parse
    Rails.cache.write "page:#{id}:html", parsed[:output]
    Rails.cache.write "page:#{id}:toc", parsed[:toc]
  end

  def html
    Rails.cache.fetch("page:#{id}:html") { parsed[:output] }
    # parsed[:output]
  end
  def toc
    Rails.cache.fetch("page:#{id}:toc") { parsed[:toc] }
    # parsed[:toc]
  end

  def parsed(source = self.source)
    @parsed ||= html_pipeline.call(source)
  end

  def fetch_source
    if s = repository.page_source(path)
      self.source = s
    else
      self.source = nil
      false
    end
  end

  def blank?
    self.source.blank?
  end

  def refresh
    fetch_source
    save
  end

  private

  def html_pipeline
    @pipeline ||= HTML::Pipeline.new [
      HTML::Pipeline::MarkdownFilter,
      TaskList::Filter,
      HTML::Pipeline::SanitizationFilter,
      DocumentUp::Filters::TableOfContents,
      HTML::Pipeline::ImageMaxWidthFilter,
      HTML::Pipeline::SyntaxHighlightFilter,
      HTML::Pipeline::EmojiFilter,
      HTML::Pipeline::AbsoluteSourceFilter,
      DocumentUp::Filters::AbsoluteLinks,
      HTML::Pipeline::MentionFilter,
      HTML::Pipeline::AutolinkFilter
    ], {
      base_url: "https://github.com/",
      asset_root: "https://assets-cdn.github.com/images/icons",
      image_base_url: "https://cdn.rawgit.com/#{repository.full_name}/#{repository.branch}/",
      image_subpage_url: "https://cdn.rawgit.com/#{repository.full_name}/#{repository.branch}/",
      link_subpage_url: "https://github.com/#{repository.full_name}/blob/#{repository.branch}/"
    }
  end

end