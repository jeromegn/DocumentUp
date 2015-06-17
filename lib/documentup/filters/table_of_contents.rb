class DocumentUp::Filters::TableOfContents < HTML::Pipeline::Filter
  PUNCTUATION_REGEXP = RUBY_VERSION > "1.9" ? /[^\p{Word}\- ]/u : /[^\w\- ]/

  def call
    result[:toc] = ""

    headers = Hash.new(0)
    doc.css('h2, h3').each do |node|
      text = node.text
      id = text.downcase
      id.gsub!(PUNCTUATION_REGEXP, '') # remove punctuation
      id.gsub!(' ', '-') # replace spaces with dash

      uniq = (headers[id] > 0) ? "-#{headers[id]}" : ''
      headers[id] += 1
      if header_content = node.children.first
        result[:toc] << %Q{<li class="#{node.name}"><a href="##{id}#{uniq}">#{text}</a></li>\n}
        header_content.add_previous_sibling(%Q{<a id="#{id}#{uniq}" class="anchor" href="##{id}#{uniq}" aria-hidden="true"><span class="octicon octicon-link"></span></a>})
      end
    end
    result[:toc] = %Q{<ul class="section-nav">\n#{result[:toc]}</ul>} unless result[:toc].empty?
    doc
  end
end