import { type NextRequest, NextResponse } from "next/server"
import { processAccount } from "@/lib/xiaomi-api"

export async function POST(request: NextRequest) {
  try {
    const { accounts } = await request.json()

    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json({ success: false, message: "未提供账号" }, { status: 400 })
    }

    try {
      const results = await Promise.all(
        accounts.map(async (account) => {
          const { username, password, steps } = account

          if (!username || !password) {
            return {
              username: username || "未知账号",
              success: false,
              message: "缺少用户名或密码",
            }
          }

          try {
            const finalSteps = steps || Math.floor(Math.random() * (98000 - 20000) + 20000);
            const success = await processAccount(
              username,
              password,
              String(finalSteps)
            )

            // 确保success是严格的布尔值true
            return {
              username,
              success: success === true,
              message: success === true ? `步数更新成功为${finalSteps}步` : "更新步数失败，请检查账号密码",
              steps: finalSteps
            }
          } catch (error) {
            console.error(`处理账号 ${username} 时出错:`, error);
            return {
              username,
              success: false,
              message: error instanceof Error ? error.message : "处理账号时发生错误",
            }
          }
        })
      )

      const allSuccessful = results.every((result) => result.success === true)
      const anySuccess = results.some((result) => result.success === true)

      // 根据处理结果返回适当的状态码
      if (allSuccessful) {
        return NextResponse.json({
          success: true,
          message: "所有账号处理成功",
          results,
        })
      } else if (anySuccess) {
        // 部分成功部分失败
        return NextResponse.json({
          success: false,
          message: "部分账号处理失败",
          results,
        }, { status: 207 }) // 207 Multi-Status
      } else {
        // 全部失败
        return NextResponse.json({
          success: false,
          message: "所有账号处理失败",
          results,
        }, { status: 400 })
      }
    } catch (batchError) {
      console.error("批量处理过程错误:", batchError);
      return NextResponse.json(
        {
          success: false,
          message: batchError instanceof Error ? batchError.message : "批量处理过程中发生错误",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("处理批量请求错误:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "发生未知错误",
      },
      { status: 500 },
    )
  }
}
