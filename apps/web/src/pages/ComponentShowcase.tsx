import { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Textarea,
} from '../components/ui';

export default function ComponentShowcase() {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UI Components Showcase</h1>
        <p className="text-gray-600">Modern SaaS design system for ClarityFlow</p>
      </div>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Variants</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Sizes</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">States</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" isLoading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Status Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-gray-700 mb-3">Status Variants</p>
          <div className="flex flex-wrap gap-3">
            <Badge status="NEEDS_CLARIFICATION">待澄清</Badge>
            <Badge status="CONFIRMED">已确认</Badge>
            <Badge status="IN_PROGRESS">进行中</Badge>
            <Badge status="DONE">已完成</Badge>
            <Badge>Default Badge</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Form Components */}
      <Card>
        <CardHeader>
          <CardTitle>Form Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input Field
            </label>
            <Input
              placeholder="Enter text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Current value: {inputValue}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input with Error
            </label>
            <Input
              placeholder="This field has an error"
              error="This field is required"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Textarea
            </label>
            <Textarea
              placeholder="Enter longer text..."
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">Character count: {textareaValue.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Card Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              This is a simple card with header and content sections.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card with Footer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Cards can have action buttons in the footer section.
            </p>
          </CardContent>
          <CardFooter>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">Cancel</Button>
              <Button variant="primary" size="sm">Action</Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Hover Effects */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            Hover over these cards to see the shadow effect:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="cursor-pointer">
              <CardContent className="p-4">
                <p className="text-sm font-medium">Card 1</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer">
              <CardContent className="p-4">
                <p className="text-sm font-medium">Card 2</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer">
              <CardContent className="p-4">
                <p className="text-sm font-medium">Card 3</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
