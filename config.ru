require 'appengine-rack'
config_from_file = YAML::load_file 'config/config.yml'
AppEngine::Rack.configure_app(
  :application => config_from_file['appengine']['application'],
  :version => config_from_file['appengine']['version']
)

ENV['RACK_ENV'] = config_from_file['appengine']['environment'] || AppEngine::Rack.environment
require 'app/ln'
run Sinatra::Application
