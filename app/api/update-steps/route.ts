import { type NextRequest, NextResponse } from "next/server"
import { processAccount } from "@/lib/xiaomi-api"

export async function POST(request: NextRequest) {
  try {
    const { username, password, steps } = await request.json()

    if (!username || !password || !steps) {
      return NextResponse.json({ success: false, message: "缺少必要字段" }, { status: 400 })
    }

    try {
      const success = await processAccount(username, password, String(steps))

      if (success === true) {
        return NextResponse.json({
          success: true,
          message: `成功将步数更新为 ${steps} 步！`,
        })
      } else {
        return NextResponse.json(
          { success: false, message: "更新步数失败，可能是账号或密码错误" }, 
          { status: 400 }
        )
      }
    } catch (processingError) {
      console.error("处理账号错误:", processingError)
      return NextResponse.json(
        {
          success: false,
          message: processingError instanceof Error 
            ? processingError.message 
            : "处理账号时发生错误",
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("处理请求错误:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "发生未知错误",
      },
      { status: 500 },
    )
  }
}
