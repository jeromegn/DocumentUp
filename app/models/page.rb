class Page < ActiveRecord::Base
  belongs_to :repository

  before_create :fetch_html
  after_save :parse, if: :html_changed?

  def parse
    # Rails.cache.write "#{id}:body", parse_body
    Rails.cache.write "page:#{id}:toc", parse_toc
  end

  # def parse_toc(source = self.source)
  #   markdown_html_toc_renderer.render(source.gsub(/\A#\s.*(?:\n|\r\n)?$/, ''))
  # end
  def parse_toc(html = self.html)
    toc = "<ul>"
    h = Nokogiri::HTML html
    h.css('h2, h3').each do |node|
      if anchor = node.children.detect {|c| c.name == 'a' && c['class'] == 'anchor' }
        toc += "<li class='#{node.name}'><a href='#{anchor['href']}'>#{node.content}</a></li>"
      end
    end
    toc += "</ul>"
    toc
  end
  def parsed_toc
    Rails.cache.fetch("page:#{id}:toc") { parse_toc }
  end

  def parse_html(html = self.html)
    h = Nokogiri::HTML html
    h.css('h2, h3').each do |node|
      if anchor = node.children.detect {|c| c.name == 'a' && c['class'] == 'anchor' }
        node['id'] = anchor['href'][1..-1]
      end
    end
    h.to_html
  end

  # def parse_body(source = self.source)
  #   markdown_renderer.render(source)
  # end
  # def parsed_body
  #   Rails.cache.fetch("#{id}:body") { parse_body }
  # end

  # def fetch_source
  #   if s = repository.page_source(path)
  #     self.source = s
  #   else
  #     self.source = nil
  #     false
  #   end
  # end

  def fetch_html
    if h = repository.page_html(path)
      self.html = parse_html(h)
    else
      self.html = nil
      false
    end
  end

  def blank?
    # self.source.blank?
    self.html.blank?
  end

  def refresh
    puts "refreshing"
    fetch_html
    # fetch_source
    save
  end

  # def markdown_html_renderer
  #   @markdown_html_renderer ||= HTMLRenderer.new(with_toc_data: true)
  # end
  # def markdown_html_toc_renderer
  #   @markdown_html_toc_renderer ||= Redcarpet::Markdown.new(Redcarpet::Render::HTML_TOC.new(nesting_level: 3), fenced_code_blocks: true)
  # end
  # def markdown_renderer
  #   @markdown_renderer ||= Redcarpet::Markdown.new(markdown_html_renderer, tables: true, autolink: true, strikethrough: true, space_after_headers: true, fenced_code_blocks: true)
  # end

end

# class HTMLRenderer < Redcarpet::Render::HTML
#   def block_code(code, language)
#     code = code.force_encoding 'utf-8'
#     highlight_code(code, language)
#   rescue MentosError => exception
#     highlight_code(code, 'text')
#   end

#   def highlight_code(code, language)
#     Pygments.highlight(code, lexer: language, formatter: 'html', options: {encoding: 'utf-8', startinline: true})
#   end
# end