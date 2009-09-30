get '/sitemap.xml' do
  content_type 'application/xml', :charset => 'utf-8'
  builder :'xml/sitemap'
end
get '/updates/rss' do
  content_type 'application/xml', :charset => 'utf-8'
  @posts
  builder :'xml/updates'
end
