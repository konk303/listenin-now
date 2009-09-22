require 'singleton'
class ConfigFile
  include Singleton
  attr_reader :config
  def initialize
    @config = YAML::load_file 'config/config.yml'
  end
end
