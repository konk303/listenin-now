get '/admin' do
  @page_title[0,0] = "admin"
  haml :admin
end

post '/admin/preview_haml' do
  haml params[:haml], :layout => false
end

get '/admin/updates' do
  @page_title[0,0] = "更新情報"
  updates = Update.all
  haml :'admin/updates', :locals => {
    :updates => updates
  }
end

post '/admin/updates' do
  Update.create(
                :display => params[:display] == "1",
                :title => params[:title],
                :body => params[:body],
                :date => Date.new(
                                  params[:date_y].to_i,
                                  params[:date_m].to_i,
                                  params[:date_d].to_i
                                  )
                )
  redirect request.path_info
end

get '/admin/updates/:id' do
  @page_title[0,0] = "更新情報"
  update = Update.get(params[:id])
  haml :'admin/update', :locals => {
    :update => update
  }
end

put '/admin/updates/:id' do
  Update.get(params[:id]).update(
                                 :display => params[:display] == "1",
                                 :title => params[:title],
                                 :body => params[:body],
                                 :date => Date.new(
                                                   params[:date_y].to_i,
                                                   params[:date_m].to_i,
                                                   params[:date_d].to_i
                                                   )
                                 )
  redirect '/admin/updates'
end

delete '/admin/updates/:id' do
  Update.get(params[:id]).destroy
  redirect '/admin/updates'
end
