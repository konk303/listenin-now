#!/usr/bin/env ruby
require 'rubygems'
require 'sass/css'

WD = File.dirname(File.expand_path(__FILE__)) + "/../"
CssDir = File.join(%w[public stylesheets])
SassDir = File.join(%w[app views sass])

def execute
  #chdir to app_root
  Dir.chdir(WD)
  #convert each files in CssDir/*.css to SassDir/*.sass
  Dir.glob(File.join(CssDir, %w[** *.css])).each do |css|
    sass = css.sub(CssDir, SassDir).sub(%r[\.css$], ".sass")
    puts "converting #{css} to #{sass}"
    File.open(sass, "w") {|file|
      file << Sass::CSS.new(File.open(css) {|f|f.read}).render
    }
  end
end

puts "this will rewrite sass files in #{SassDir}, execute? [y/n]"
while input = gets.chomp!
  if input =~ /^(y|Y)/
    execute
    break
  elsif input =~ /^(n|N)/
    break
  else
    puts "please answer yes/no"
  end
end
