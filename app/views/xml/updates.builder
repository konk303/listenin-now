xml.instruct! :xml, :version => '1.0'
xml.rss :version => "2.0" do
  xml.channel do
    xml.title "リスニンなう 更新情報"
    xml.description "mixiアプリ「リスニンなう」の更新情報"
    xml.link request.scheme + '://' + request.host + "/"
    @posts.each do |post|
      xml.item do
        xml.title post.title
        xml.link request.scheme + '://' + request.host + "/updates/#{post.id}"
        xml.description haml post.body, :layout => false
        xml.pubDate post.date.rfc822()
        xml.guid request.scheme + '://' + request.host + "/updates/#{post.id}"
      end
    end
  end
end
