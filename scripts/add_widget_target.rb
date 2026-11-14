#!/usr/bin/env ruby
# Adds the DadJokesWidget (WidgetKit) extension target to the Xcode project and
# embeds it in the app. Safe to run more than once. Requires: gem install xcodeproj
require 'xcodeproj'

project_path = File.expand_path('../ios/App/App.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |t| t.name == 'App' } or abort('App target not found')
if project.targets.any? { |t| t.name == 'DadJokesWidget' }
  puts 'DadJokesWidget target already present'
  exit
end

app_settings = app.build_configurations.first.build_settings
widget = project.new_target(:app_extension, 'DadJokesWidget', :ios, '15.0', nil, :swift)

group = project.main_group.new_group('DadJokesWidget', 'DadJokesWidget')
swift = group.new_file('DadJokesWidget.swift')
json = group.new_file('jokes.json')
group.new_file('Info.plist')
widget.add_file_references([swift])
widget.resources_build_phase.add_file_reference(json)

widget.build_configurations.each do |config|
  s = config.build_settings
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['PRODUCT_BUNDLE_IDENTIFIER'] = "#{app_settings['PRODUCT_BUNDLE_IDENTIFIER']}.widget"
  s['INFOPLIST_FILE'] = 'DadJokesWidget/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['MARKETING_VERSION'] = app_settings['MARKETING_VERSION']
  s['CURRENT_PROJECT_VERSION'] = app_settings['CURRENT_PROJECT_VERSION']
  s['SWIFT_VERSION'] = '5.0'
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
  s['SKIP_INSTALL'] = 'YES'
  s['CODE_SIGN_STYLE'] = 'Automatic'
  s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
  s['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
end

app.add_dependency(widget)
embed = app.new_copy_files_build_phase('Embed Foundation Extensions')
embed.dst_subfolder_spec = '13' # PlugIns
embed.add_file_reference(widget.product_reference, true).settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

project.save
puts 'Added DadJokesWidget target'
