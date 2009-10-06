get '/updates' do
  @page_title[0,0] = "更新履歴"
  updates = Update.all_display
  haml :updates, :locals => {:updates => updates}
end

get '/updates/rss' do
  content_type 'application/xml', :charset => 'utf-8'
  @posts = Update.all_display
  builder :'xml/updates'
end

get '/updates/:id' do
  update = Update.get(params[:id])
  @page_title[0,0] = "#{h update.title} - 更新履歴"
  haml :update, :locals => {:update => update}
end
