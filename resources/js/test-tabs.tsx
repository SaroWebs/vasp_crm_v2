// Test file to verify tabs component imports
import React from "react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs"

function TestComponent() {
  return (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div>Content for tab 1</div>
      </TabsContent>
      <TabsContent value="tab2">
        <div>Content for tab 2</div>
      </TabsContent>
    </Tabs>
  )
}

export default TestComponent