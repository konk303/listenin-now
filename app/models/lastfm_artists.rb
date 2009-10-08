class LastFmArtist
  include DataMapper::Resource

  EXPIRE = 60 * 60 * 24 * 7 # can be cached for 1 week

  property :name, String, :key => true
  property :images, List
  property :container, String
  property :updater_id, String
  property :updater_name, String
  property :created_at, Time, :default => Time.new
  property :updated_at, Time

  before :save do
    self.updated_at = Time.new
  end

  def self.get_unexpired artist
    first(:updated_at.gt => Time.new - EXPIRE, :name => artist)
  end
end
