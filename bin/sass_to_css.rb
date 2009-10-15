#!/usr/bin/env ruby
require 'rubygems'
require 'sass'

WD = File.dirname(File.expand_path(__FILE__)) + "/../"
CssDir = File.join(%w[public stylesheets])
SassDir = File.join(%w[app views sass])

def execute
  #chdir to app_root
  Dir.chdir(WD)
  #convert each files in SassDir/*.sass to CssDir/*.css
  Dir.glob(File.join(SassDir, %w[** *.sass])).each do |sass|
    css = sass.sub(SassDir, CssDir).sub(%r[\.sass$], ".css")
    puts "converting #{sass} to #{css}"
    File.open(css, "w") {|file|
      file << Sass::Engine.new(File.open(sass) {|f|f.read}, {
                                 :style => :expanded,
                                 :cache => false,
                                 :load_paths => [SassDir]
                               }).render
    }
  end
end

execute
