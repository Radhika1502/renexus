import React from 'react';
import Head from 'next/head';
import { Layout } from '../src/components/Layout';
import { useSettings } from '../src/hooks/useSettings';
import {
  Button,
  Card,
  Switch,
  Select,
  Slider,
  RadioGroup
} from '../src/components/ui';
import {
  Cog6ToothIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  CircuitBoardIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const {
    settings,
    isLoading,
    isSaving,
    error,
    updateAIFeature,
    updatePreferences
  } = useSettings();

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme });
  };

  const handleNotificationChange = (type: keyof typeof settings?.preferences.notifications) => {
    if (!settings) return;
    updatePreferences({
      notifications: {
        ...settings.preferences.notifications,
        [type]: !settings.preferences.notifications[type]
      }
    });
  };

  const handleDefaultViewChange = (defaultView: 'list' | 'board' | 'calendar') => {
    updatePreferences({ defaultView });
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePreferences({ timezone: e.target.value });
  };

  return (
    <>
      <Head>
        <title>Settings | Renexus</title>
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <Cog6ToothIcon className="w-8 h-8 mr-3 text-gray-600" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {isLoading ? (
            <div>Loading settings...</div>
          ) : settings ? (
            <div className="space-y-8">
              {/* User Preferences */}
              <section>
                <h2 className="text-xl font-semibold mb-4">User Preferences</h2>
                <div className="grid gap-6">
                  {/* Theme Selection */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Theme</h3>
                    <RadioGroup
                      value={settings.preferences.theme}
                      onChange={handleThemeChange}
                      className="grid grid-cols-3 gap-4"
                    >
                      <RadioGroup.Option value="light" className="relative">
                        {({ checked }) => (
                          <div className={`
                            p-4 rounded-lg border-2 cursor-pointer
                            ${checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                          `}>
                            <div className="flex items-center">
                              <SunIcon className="w-5 h-5 mr-2" />
                              <span>Light</span>
                            </div>
                          </div>
                        )}
                      </RadioGroup.Option>
                      <RadioGroup.Option value="dark" className="relative">
                        {({ checked }) => (
                          <div className={`
                            p-4 rounded-lg border-2 cursor-pointer
                            ${checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                          `}>
                            <div className="flex items-center">
                              <MoonIcon className="w-5 h-5 mr-2" />
                              <span>Dark</span>
                            </div>
                          </div>
                        )}
                      </RadioGroup.Option>
                      <RadioGroup.Option value="system" className="relative">
                        {({ checked }) => (
                          <div className={`
                            p-4 rounded-lg border-2 cursor-pointer
                            ${checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                          `}>
                            <div className="flex items-center">
                              <ComputerDesktopIcon className="w-5 h-5 mr-2" />
                              <span>System</span>
                            </div>
                          </div>
                        )}
                      </RadioGroup.Option>
                    </RadioGroup>
                  </Card>

                  {/* Notifications */}
                  <Card className="p-6">
                    <div className="flex items-center mb-4">
                      <BellIcon className="w-5 h-5 mr-2" />
                      <h3 className="text-lg font-medium">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Email Notifications</span>
                        <Switch
                          checked={settings.preferences.notifications.email}
                          onChange={() => handleNotificationChange('email')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Push Notifications</span>
                        <Switch
                          checked={settings.preferences.notifications.push}
                          onChange={() => handleNotificationChange('push')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Desktop Notifications</span>
                        <Switch
                          checked={settings.preferences.notifications.desktop}
                          onChange={() => handleNotificationChange('desktop')}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Default View */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Default View</h3>
                    <Select
                      value={settings.preferences.defaultView}
                      onChange={(e) => handleDefaultViewChange(e.target.value as any)}
                      className="w-full"
                    >
                      <option value="list">List View</option>
                      <option value="board">Board View</option>
                      <option value="calendar">Calendar View</option>
                    </Select>
                  </Card>

                  {/* Timezone */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Timezone</h3>
                    <Select
                      value={settings.preferences.timezone}
                      onChange={handleTimezoneChange}
                      className="w-full"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </Select>
                  </Card>
                </div>
              </section>

              {/* AI Features Configuration */}
              <section>
                <div className="flex items-center mb-4">
                  <CircuitBoardIcon className="w-6 h-6 mr-2" />
                  <h2 className="text-xl font-semibold">AI Features</h2>
                </div>
                <div className="grid gap-6">
                  {settings.aiFeatures.map((feature) => (
                    <Card key={feature.id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium">{feature.name}</h3>
                          <p className="text-gray-600 mt-1">{feature.description}</p>
                        </div>
                        <Switch
                          checked={feature.enabled}
                          onChange={() => updateAIFeature(feature.id, { enabled: !feature.enabled })}
                        />
                      </div>
                      {feature.enabled && (
                        <div className="space-y-4 mt-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confidence Threshold
                            </label>
                            <Slider
                              value={feature.confidence}
                              onChange={(value) => updateAIFeature(feature.id, { confidence: value })}
                              min={0}
                              max={100}
                              step={1}
                            />
                            <div className="text-sm text-gray-500 mt-1">
                              {feature.confidence}% minimum confidence required
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Suggestion Frequency
                            </label>
                            <Select
                              value={feature.frequency}
                              onChange={(e) => updateAIFeature(feature.id, { frequency: e.target.value as any })}
                              className="w-full"
                            >
                              <option value="low">Low - Less frequent, high-impact suggestions</option>
                              <option value="medium">Medium - Balanced frequency and impact</option>
                              <option value="high">High - More frequent suggestions</option>
                            </Select>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {isSaving && (
            <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
              Saving changes...
            </div>
          )}
        </div>
      </Layout>
    </>
  );
} 
