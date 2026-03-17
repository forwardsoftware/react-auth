require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'react-auth-google'
  s.version        = package['version']
  s.summary        = package['description'] || 'Google Sign-In for react-auth'
  s.homepage       = 'https://github.com/nicolomaioli/react-auth'
  s.license        = package['license']
  s.author         = 'ForWarD Software'
  s.source         = { :git => 'https://github.com/nicolomaioli/react-auth.git', :tag => s.version.to_s }

  s.platform       = :ios, '15.1'
  s.swift_version  = '5.0'
  s.source_files   = 'ios/**/*.{swift,h,m}'

  s.dependency 'ExpoModulesCore'
  s.dependency 'GoogleSignIn', '~> 8.0'
end
