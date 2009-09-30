xml.instruct! :xml, :version => '1.0'
xml.rss :version => "2.0" do
  xml.channel do
    xml.title "リスニンなう 更新情報"
    xml.description "mixiアプリ「リスニンなう」の更新情報"
    xml.link "http://listenin-now.konk303.com/"
#     @posts.each do |post|
#       xml.item do
#         xml.title post.title
#         xml.link "http://listenin-now.konk303.com/updates/#{post.id}"
#         xml.description post.body
#         xml.pubDate Time.parse(post.created_at.to_s).rfc822()
#         xml.guid "http://listenin-now.konk303.com/updates/#{post.id}"
#       end
#     end
  end
end
