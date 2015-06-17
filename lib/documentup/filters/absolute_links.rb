require 'uri'

class DocumentUp::Filters::AbsoluteLinks < HTML::Pipeline::Filter

  def call
    doc.search("a").each do |element|
      href = (element['href'] || '').strip
      next if href.nil? || href.blank?
      unless href.start_with?('http') || href.start_with?('//')
        element['href'] = URI.join(link_subpage_url, href).to_s
      end
    end
    doc
  end

  # Private: the relative url you want to use
  def link_subpage_url
    context[:link_subpage_url] or raise "Missing context :link_subpage_url for #{self.class.name}"
  end

end