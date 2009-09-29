require 'rubygems'
require 'sinatra'
require 'haml'
require 'yaml'
require 'builder'
require 'appengine-apis/logger'
require 'appengine-apis/users'



#configure
configure do
  #gae logger
  Log = AppEngine::Logger.new
  Log.level = AppEngine::Logger::DEBUG
  #set config from yaml
  @config = ConfigFile.instance.config
  @config['common'].each {|key,val| set key.to_sym => val}
  #locations
  set :app_file => __FILE__
  #logs can be retrieved from gae
  disable :logging
  #static files are served from gae static options
  disable :static
#   disable :dump_errors
  #haml options
  set :haml, { :format => :html5}
end

configure :development do
  @config['development'].each {|key,val| set key.to_sym => val}
  #reloading, http://groups.google.com/group/appengine-jruby/browse_thread/thread/dbf5cb3c9b7e3ff6/04ba4409cfc9c8b4?lnk=gst&q=shotgun#04ba4409cfc9c8b4
  require 'lib/reloader'
  use Sinatra::Reloader
  use Sinatra::ShowExceptions
end

configure :production do
  @config['production'].each {|key,val| set key.to_sym => val}
end



#before filter
before do
  @body_id = request.path_info.split('/')[1] || 'index'
  @page_title = " - mixiアプリ「リスニンなう」"
  @description = "opensocial gadget / mixiアプリ 「リスニンなう」の紹介です。"
  #auth処理 for /admin
  if request.path_info =~ %r{^/admin}
    @user = AppEngine::Users.current_user
    @admin = @user ? AppEngine::Users.admin? : nil
    redirect AppEngine::Users.create_login_url('/admin'), 302 unless @admin
  end
#  p @admin, request.path_info, options.environment
end



#for maintenance
# get '/*' do
#   redirect 'http://d.hatena.ne.jp/konk303/', 302
# end

#controllers
# redirect *.html to *
get %r{(.*)\.html$} do |c|
  redirect c, 301
end
# redirect */index  to */
get %r{(.*/)index$} do |c|
  redirect c, 301
end
# redirect */  to *
get %r{(.+)/$} do |c|
  redirect c, 301
end

get '/' do
  @page_title[0,0] = "listenin' now"
  haml :index, :locals => {
  }
end

get '/help' do
  @page_title[0,0] = "ヘルプ"
  haml @body_id.intern
end

get '/demo' do
  @page_title[0,0] = "デモ"
  haml @body_id.intern
end

get '/updates' do
  @page_title[0,0] = "更新履歴"
  # todo: datastore使ってcms化
  haml :updates, :locals => {
    :updates => [
                 {:date => Time.local(2009,9,25),
                   :title =>'説明サイトをオープンしました',
                   :content => <<"EOF"
<p>説明サイトを作成し、オープンしました。</p>
EOF
                 },
                 {:date => Time.local(2009,9,25),
                   :title =>'サーバーを移転しました',
                   :content => <<"EOF"
<p>google app engine上にサーバーを移転しました。</p>
EOF
                 },
                ]
  }
end

get '/feedback' do
  @page_title[0,0] = "フィードバック"
  haml @body_id.intern
end

get '/tech' do
  @page_title[0,0] = "技術情報"
  haml @body_id.intern
end

get '/author' do
  @page_title[0,0] = "作者について"
  haml @body_id.intern
end

get '/api/lastfm' do
  require 'app/models/lastfm'
#   response = LastFm.new(options.last_fm['api_key']).get(params)
#   content_type response[:content_type], :charset => response[:charset]
#   status response[:code]
#   response[:body]
  #memcache doesn't expire as I expected. use redirect
  lastfm = LastFm.new(options.last_fm['api_key'])
  lastfm.build_query(params)
  url = lastfm.build_target_uri
  redirect url.to_s, 302

end

get '/api/amazon' do
end

get '/xml/listenin-now.xml' do
  content_type 'application/xml', :charset => 'utf-8'
  builder :ln
end

#sitemap, rss
get '/sitemap.xml' do
  content_type 'application/xml', :charset => 'utf-8'
  builder :sitemap
end
get '/updates/rss' do
  content_type 'application/xml', :charset => 'utf-8'
  @posts
  builder :updates
end

#admin
get '/admin' do
  @page_title[0,0] = "admin"
  haml :admin
end
get '/admin/updates' do
  @page_title[0,0] = "更新履歴 編集"
  haml :admin
end
post '/admin/updates' do
end
