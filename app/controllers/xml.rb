get '/sitemap.xml' do
  content_type 'application/xml', :charset => 'utf-8'
  @posts = Update.all_display
  builder :'xml/sitemap'
end
