# Creates the (empty) App Review Information record for the version being
# prepared, if it doesn't exist yet. New apps don't have one until someone opens
# that section in App Store Connect, and fastlane deliver crashes without it.
# Usage: ruby scripts/ci/ensure_review_detail.rb <api_key.json> <bundle id> <version>
require "spaceship"

key_json, bundle_id, version = ARGV
Spaceship::ConnectAPI.token = Spaceship::ConnectAPI::Token.from(filepath: key_json)

app = Spaceship::ConnectAPI::App.find(bundle_id) or abort("::error::No app with bundle ID #{bundle_id} in App Store Connect.")
v = app.get_edit_app_store_version(platform: Spaceship::ConnectAPI::Platform::IOS)
abort("::error::No editable App Store version found. Create version #{version} in App Store Connect first.") unless v
puts "Editable version: #{v.version_string} (#{v.app_store_state})"
warn "::warning::Editable version is #{v.version_string}, not #{version}." if v.version_string != version

begin
  v.fetch_app_store_review_detail
  puts "App Review Information already exists."
rescue StandardError
  v.create_app_store_review_detail(attributes: {})
  puts "Created the App Review Information section."
end

# Diagnostics: show which languages the listing has, so it's clear where text lands.
begin
  puts "App primary locale: #{app.primary_locale}"
  info = app.fetch_edit_app_info || app.fetch_live_app_info
  if info
    info.get_app_info_localizations.each do |l|
      puts "App Info [#{l.locale}] subtitle=#{l.subtitle.inspect} privacy_url=#{l.privacy_policy_url.inspect}"
    end
  end
  v.get_app_store_version_localizations.each do |l|
    puts "Version [#{l.locale}] description set: #{!l.description.to_s.empty?}, keywords set: #{!l.keywords.to_s.empty?}"
  end
rescue StandardError => e
  puts "(Couldn't list localizations: #{e.class})"
end
