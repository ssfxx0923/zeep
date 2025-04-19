"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react"
import AccountList from "@/components/account-list"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { motion } from "framer-motion"

// 账号接口定义
export interface Account {
  username: string
  password: string
  steps: number
}

export default function Home() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [stepCount, setStepCount] = useState(20000)
  const [loading, setLoading] = useState(false)
  const [useRandomSteps, setUseRandomSteps] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()
  const isMobile = useMobile()

  // 从本地存储加载账号
  useEffect(() => {
    const loadAccounts = () => {
      try {
        const savedAccounts = localStorage.getItem("xiaomi-step-accounts")
        if (savedAccounts) {
          setAccounts(JSON.parse(savedAccounts))
        }
      } catch (error) {
        console.error("加载账号失败:", error)
        toast({
          title: "加载失败",
          description: "无法从本地存储加载账号信息",
          variant: "destructive",
        })
      }
    }

    loadAccounts()
  }, [toast])

  // 保存账号到本地存储
  const saveAccounts = (newAccounts: Account[]) => {
    try {
      localStorage.setItem("xiaomi-step-accounts", JSON.stringify(newAccounts))
      setAccounts(newAccounts)
    } catch (error) {
      console.error("保存账号失败:", error)
      toast({
        title: "保存失败",
        description: "无法将账号信息保存到本地存储",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async () => {
    if (!username || !password) {
      toast({
        title: "信息缺失",
        description: "请输入用户名和密码",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const finalStepCount = useRandomSteps ? Math.floor(Math.random() * (98000 - 20000) + 20000) : stepCount

      // 调用真实API
      const response = await fetch("/api/update-steps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          steps: finalStepCount,
        }),
      })

      // 检查HTTP状态码
      if (!response.ok) {
        const errorData = await response.json()
        setResult({
          success: false,
          message: errorData.message || `请求失败，状态码: ${response.status}`,
        })
        
        toast({
          title: "失败",
          description: errorData.message || `请求失败，状态码: ${response.status}`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const data = await response.json()

      // 严格检查响应体中的success字段
      if (data && typeof data === 'object' && data.success === true) {
        setResult({
          success: true,
          message: data.message || "操作已完成",
        })

        toast({
          title: "成功！",
          description: data.message,
        })
      } else {
        setResult({
          success: false,
          message: data.message || "未知错误，请稍后再试",
        })

        toast({
          title: "失败",
          description: data.message || "未知错误，请稍后再试",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("API请求错误:", error);
      setResult({
        success: false,
        message: `更新步数失败: ${error instanceof Error ? error.message : "未知错误"}`,
      })

      toast({
        title: "错误",
        description: "更新步数失败，请检查网络连接",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBatchProcess = async () => {
    if (accounts.length === 0) {
      toast({
        title: "无账号",
        description: "请先添加账号",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // 调用批量处理API
      const response = await fetch("/api/batch-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accounts,
        }),
      })

      // 检查HTTP状态码
      if (!response.ok) {
        const errorData = await response.json()
        toast({
          title: "批量处理失败",
          description: errorData.message || `请求失败，状态码: ${response.status}`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const data = await response.json()

      // 严格检查响应结构和success字段
      if (data && typeof data === 'object' && data.success === true && Array.isArray(data.results)) {
        // 检查是否所有账号都处理成功
        const allSuccessful = data.results.every((result: any) => result.success === true)
        
        if (allSuccessful) {
          toast({
            title: "批量处理完成",
            description: "所有账号处理成功",
          })
        } else {
          // 显示每个账号的处理结果
          data.results.forEach((result: { username: string; success: boolean; message: string }) => {
            toast({
              title: result.success ? "处理成功" : "处理失败",
              description: `账号 ${result.username}: ${result.message || "未知状态"}`,
              variant: result.success ? "default" : "destructive",
            })
          })
        }
      } else {
        // 整体处理失败或返回格式不正确
        toast({
          title: "批量处理失败",
          description: data && data.message ? data.message : "处理过程中发生错误或返回数据格式不正确",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("批量处理API请求错误:", error);
      toast({
        title: "批量处理错误",
        description: `发生错误: ${error instanceof Error ? error.message : "未知错误"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStepInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // 允许输入框为空
    if (inputValue === "") {
      setStepCount(0)
      return
    }
    
    // 只有当输入值是合法数字时才更新状态
    const value = Number.parseInt(inputValue)
    if (!isNaN(value) && value >= 0) {
      // 限制最大值为98000
      const limitedValue = Math.min(value, 98000)
      setStepCount(limitedValue)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-blue-50">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center"
      >
        <Sparkles className="h-6 w-6 mr-2 text-primary animate-pulse" />
        <h1 className="text-3xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
          Zeep步数修改器
        </h1>
        <Sparkles className="h-6 w-6 ml-2 text-primary animate-pulse" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-t border-l border-white/20 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-gradient bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
              Zeep步数修改器
            </CardTitle>
            <CardDescription className="text-center">修改您的Zeep步数</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-pink-100">
                <TabsTrigger value="single" className="data-[state=active]:bg-white">
                  单个账号
                </TabsTrigger>
                <TabsTrigger value="batch" className="data-[state=active]:bg-white">
                  批量处理
                </TabsTrigger>
              </TabsList>

              <motion.div variants={container} initial="hidden" animate="show">
                <TabsContent value="single" className="space-y-4">
                  <motion.div variants={item} className="space-y-2">
                    <Label htmlFor="username">邮箱或手机号</Label>
                    <Input
                      id="username"
                      placeholder="邮箱或手机号"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="border-pink-200 focus:border-pink-500"
                    />
                  </motion.div>

                  <motion.div variants={item} className="space-y-2">
                    <Label htmlFor="password">密码</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-pink-200 focus:border-pink-500"
                    />
                  </motion.div>

                  <motion.div variants={item} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="steps">步数</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="random-steps" checked={useRandomSteps} onCheckedChange={setUseRandomSteps} />
                        <Label htmlFor="random-steps">随机步数</Label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Slider
                        id="steps"
                        disabled={useRandomSteps}
                        min={1000}
                        max={98000}
                        step={1000}
                        value={[stepCount]}
                        onValueChange={(value) => setStepCount(value[0])}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={stepCount}
                        onChange={handleStepInputChange}
                        disabled={useRandomSteps}
                        className="w-24 border-pink-200 focus:border-pink-500"
                      />
                    </div>
                  </motion.div>

                  {result && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className={`p-3 rounded-md flex items-center space-x-2 ${
                        result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {result.success ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      <span>{result.message}</span>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="batch">
                  <AccountList accounts={accounts} setAccounts={saveAccounts} />
                </TabsContent>
              </motion.div>
            </Tabs>
          </CardContent>

          <CardFooter>
            <Tabs defaultValue="single" className="w-full">
              <TabsContent value="single">
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 transition-all duration-300"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "处理中..." : "更新步数"}
                </Button>
              </TabsContent>

              <TabsContent value="batch">
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 transition-all duration-300"
                  onClick={handleBatchProcess}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "处理中..." : "批量处理所有账号"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardFooter>
        </Card>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-4 text-sm text-gray-500 text-center"
      >
        本应用由ssfxx开发
        <br />
        请负责任地使用，风险自负。
      </motion.p>
    </main>
  )
}
