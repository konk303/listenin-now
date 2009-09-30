require 'rubygems'
require 'sinatra'
require 'haml'
require 'yaml'
require 'builder'
require 'appengine-apis/logger'
require 'appengine-apis/urlfetch'
require 'appengine-apis/users'
require 'dm-core'
# Load all the ruby files in app/models
Dir.glob(::File.join(%w[app models ** *.rb])).each {|fn|require fn}
# datastore lang patch
require 'lib/datastore_patch'

#configure
configure do
  #gae logger
  Log = AppEngine::Logger.new
  Log.level = AppEngine::Logger::DEBUG
  #overwrite Net::HTTP with appengine-urlfetch
  Net::HTTP = AppEngine::URLFetch::HTTP
  #data-mapper
  DataMapper.setup(:default, "appengine://auto")
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



#helpers
helpers do
  include Rack::Utils
  alias_method :h, :escape_html
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



#controllers

#for maintenance
#load 'app/controllers/maintenance.rb'

#url optimize
load 'app/controllers/url_optimize.rb'

#app urls
load 'app/controllers/app.rb'

#sitemap, rss
load 'app/controllers/xml.rb'

#admin
load 'app/controllers/admin.rb'

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

get '/updates/:id' do
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




get '/admin' do
  @page_title[0,0] = "admin"
  haml :admin
end

get '/admin/updates' do
  @page_title[0,0] = "更新情報"
  updates = Update.all(:order => [:id.desc])
  haml :'admin/updates', :locals => {
    :updates => updates
  }
end

post '/admin/updates' do
  Update.create(:title => params[:title], :body => params[:body], :created_at => Time.now)
  redirect request.path_info
end

get '/admin/updates/:id' do
  update = Update.get(params[:id])
  haml :'admin/update', :locals => {
    :update => update
  }
end

put '/admin/updates/:id' do
  Update.get(params[:id]).update(:title => params[:title], :body => params[:body])
  redirect '/admin/updates'
end

delete '/admin/updates/:id' do
  Update.get(params[:id]).destroy
  redirect '/admin/updates'
end
