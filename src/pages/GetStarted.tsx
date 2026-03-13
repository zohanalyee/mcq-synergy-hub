
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";

const GetStarted = () => {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <Header>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <h1 className="text-3xl font-bold mb-2">Get Started with MCQSAI</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            Choose a plan that works for you and start enhancing your learning experience.
          </p>
        </motion.div>

        <Tabs defaultValue="monthly" className="mb-6">
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly (Save 20%)</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="monthly">
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto"
            >
              <motion.div variants={item}>
                <Card className="border-border/60 h-full">
                  <CardHeader>
                    <CardTitle>Free Plan</CardTitle>
                    <CardDescription>Basic access to our platform</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">$0</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>5 mock tests per month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Basic analytics</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Access to 3 subjects</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Community support</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
              
              <motion.div variants={item}>
                <Card className="border-primary h-full relative overflow-hidden">
                  <div className="absolute -right-10 top-5 rotate-45 bg-primary text-primary-foreground px-10 py-1 text-xs font-medium">
                    Popular
                  </div>
                  <CardHeader>
                    <CardTitle>Pro Plan</CardTitle>
                    <CardDescription>Perfect for serious students</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">$9.99</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Unlimited mock tests</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Detailed performance analytics</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Access to all subjects</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Email support</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Progress tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Custom study plans</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
              
              <motion.div variants={item}>
                <Card className="border-border/60 h-full">
                  <CardHeader>
                    <CardTitle>Premium Plan</CardTitle>
                    <CardDescription>For advanced learning needs</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">$19.99</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Everything in Pro plan</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>AI-based question recommendations</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>1-on-1 tutoring sessions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Priority support</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Offline access to tests</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Certificate of completion</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="yearly">
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              <motion.div variants={item}>
                <Card className="border-border/60 h-full">
                  <CardHeader>
                    <CardTitle>Free Plan</CardTitle>
                    <CardDescription>Basic access to our platform</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">$0</span>
                      <span className="text-muted-foreground">/year</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>5 mock tests per month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Basic analytics</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Access to 3 subjects</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Community support</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
              
              <motion.div variants={item}>
                <Card className="border-primary h-full relative overflow-hidden">
                  <div className="absolute -right-10 top-5 rotate-45 bg-primary text-primary-foreground px-10 py-1 text-xs font-medium">
                    Popular
                  </div>
                  <CardHeader>
                    <CardTitle>Pro Plan</CardTitle>
                    <CardDescription>Perfect for serious students</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">$95.90</span>
                      <span className="text-muted-foreground">/year</span>
                    </div>
                    <p className="text-sm text-green-500 font-medium mt-1">Save $24 compared to monthly</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Unlimited mock tests</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Detailed performance analytics</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Access to all subjects</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Email support</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Progress tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Custom study plans</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
              
              <motion.div variants={item}>
                <Card className="border-border/60 h-full">
                  <CardHeader>
                    <CardTitle>Premium Plan</CardTitle>
                    <CardDescription>For advanced learning needs</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">$191.90</span>
                      <span className="text-muted-foreground">/year</span>
                    </div>
                    <p className="text-sm text-green-500 font-medium mt-1">Save $48 compared to monthly</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Everything in Pro plan</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>AI-based question recommendations</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>1-on-1 tutoring sessions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Priority support</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Offline access to tests</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Certificate of completion</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
            </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </Header>
  );
};

export default GetStarted;
