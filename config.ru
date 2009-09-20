require 'appengine-rack'
AppEngine::Rack.configure_app(
  :application => 'sandbox-konk303', # Replace your application id.
  :version => 1                     # Replace your application version.
)

ENV['RACK_ENV'] = AppEngine::Rack.environment
#ENV['RACK_ENV'] = "production"
require 'app/ln'
run Sinatra::Application
