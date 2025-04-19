"use client"
import type { Account } from "@/app/page"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AccountListProps {
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void
}

export default function AccountList({ accounts, setAccounts }: AccountListProps) {
  const [newAccount, setNewAccount] = useState<Account>({
    username: "",
    password: "",
    steps: 20000,
  })

  const handleAddAccount = () => {
    if (!newAccount.username || !newAccount.password) return

    const updatedAccounts = [...accounts, { ...newAccount }]
    setAccounts(updatedAccounts)

    setNewAccount({
      username: "",
      password: "",
      steps: 20000,
    })
  }

  const handleRemoveAccount = (index: number) => {
    const newAccounts = [...accounts]
    newAccounts.splice(index, 1)
    setAccounts(newAccounts)
  }

  const updateAccount = (index: number, field: keyof Account, value: string | number) => {
    const newAccounts = [...accounts]
    
    // 针对步数字段的特殊处理
    if (field === "steps") {
      // 当输入为空时设置为0
      if (value === "") {
        newAccounts[index] = {
          ...newAccounts[index],
          [field]: 0,
        }
      } else {
        // 否则尝试转换为数字
        const numValue = Number(value)
        if (!isNaN(numValue) && numValue >= 0) {
          // 限制最大值为98000
          const limitedValue = Math.min(numValue, 98000)
          newAccounts[index] = {
            ...newAccounts[index],
            [field]: limitedValue,
          }
        }
      }
    } else {
      // 其他字段直接更新
      newAccounts[index] = {
        ...newAccounts[index],
        [field]: value,
      }
    }
    
    setAccounts(newAccounts)
  }

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700 text-sm">
          账号信息将保存在本地浏览器中，刷新页面后不会丢失
        </AlertDescription>
      </Alert>

      <ScrollArea className="h-[240px] pr-4">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p>暂无账号，请添加账号</p>
          </div>
        ) : (
          <AnimatePresence>
            {accounts.map((account, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.3 }}
                className="flex flex-col space-y-2 p-3 border rounded-md mb-3 border-pink-200 hover:border-pink-400 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <Label className="font-medium">账号 {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAccount(index)}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="邮箱/手机号"
                    value={account.username}
                    onChange={(e) => updateAccount(index, "username", e.target.value)}
                    className="col-span-3 sm:col-span-1 border-pink-200 focus:border-pink-500"
                  />
                  <Input
                    placeholder="密码"
                    type="password"
                    value={account.password}
                    onChange={(e) => updateAccount(index, "password", e.target.value)}
                    className="col-span-3 sm:col-span-1 border-pink-200 focus:border-pink-500"
                  />
                  <Input
                    placeholder="步数"
                    type="number"
                    value={account.steps}
                    onChange={(e) => updateAccount(index, "steps", e.target.value)}
                    className="col-span-3 sm:col-span-1 border-pink-200 focus:border-pink-500"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </ScrollArea>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col space-y-2 p-3 border rounded-md border-dashed border-pink-300"
      >
        <Label className="font-medium">添加新账号</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder="邮箱/手机号"
            value={newAccount.username}
            onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
            className="col-span-3 sm:col-span-1 border-pink-200 focus:border-pink-500"
          />
          <Input
            placeholder="密码"
            type="password"
            value={newAccount.password}
            onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
            className="col-span-3 sm:col-span-1 border-pink-200 focus:border-pink-500"
          />
          <Input
            placeholder="步数"
            type="number"
            value={newAccount.steps}
            onChange={(e) => {
              const value = e.target.value
              if (value === "") {
                setNewAccount({ ...newAccount, steps: 0 })
              } else {
                const numValue = Number(value)
                if (!isNaN(numValue) && numValue >= 0) {
                  // 限制最大值为98000
                  const limitedValue = Math.min(numValue, 98000)
                  setNewAccount({ ...newAccount, steps: limitedValue })
                }
              }
            }}
            className="col-span-3 sm:col-span-1 border-pink-200 focus:border-pink-500"
          />
        </div>
        <Button
          variant="outline"
          className="w-full mt-2 border-dashed border-pink-300 hover:bg-pink-100 transition-all duration-300"
          onClick={handleAddAccount}
        >
          <Plus className="h-4 w-4 mr-2" />
          添加账号
        </Button>
      </motion.div>
    </div>
  )
}
