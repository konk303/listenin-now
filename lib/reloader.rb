class Sinatra::Reloader < Rack::Reloader
  def safe_load(file, mtime, stderr = $stderr)
    ::Sinatra::Application.reset!
    super
  end
end
