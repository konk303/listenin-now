require 'appengine-rack'
require 'lib/config'

config = ConfigFile.instance.config
AppEngine::Rack.configure_app(
  :application => config['appengine']['application'],
  :version => config['appengine']['version']
)

ENV['RACK_ENV'] = config['appengine']['environment'] || AppEngine::Rack.environment
require 'app/ln'
run Sinatra::Application
