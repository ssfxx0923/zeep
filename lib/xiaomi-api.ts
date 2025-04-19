/**
 * 小米运动API客户端，用于修改步数
 */

// 获取当前时间戳（毫秒）
export function getTimestamp(): string {
  return String(Date.now())
}

// 从重定向URL中提取code
export function getCode(location: string): string {
  const codePattern = /(?<=access=).*?(?=&)/
  const match = location.match(codePattern)
  return match ? match[0] : ""
}

// 使用登录令牌获取应用令牌
export async function getAppToken(loginToken: string): Promise<string | null> {
  const url = `https://account-cn.huami.com/v1/client/app_tokens?app_name=com.xiaomi.hm.health&dn=api-user.huami.com%2Capi-mifit.huami.com%2Capp-analytics.huami.com&login_token=${loginToken}`

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "MiFit/6.3.5 (iPhone; iOS 14.0.1; Scale/2.00)",
      },
    })

    const data = await response.json()
    return data.token_info.app_token
  } catch (error) {
    console.error("获取应用令牌错误:", error)
    return null
  }
}

// 登录小米账号
export async function login(
  user: string,
  password: string,
): Promise<{ loginToken: string | null; userId: string | null }> {
  // 如果不是邮箱，添加国家代码
  if (!user.match(/@(.*?)\.com/)) {
    user = "+86" + user
  }

  const registrationsUrl = `https://api-user.huami.com/registrations/${user}/tokens`

  try {
    // 第一个请求获取code
    const response = await fetch(registrationsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "MiFit/6.3.5 (iPhone; iOS 14.0.1; Scale/2.00)",
      },
      body: new URLSearchParams({
        client_id: "HuaMi",
        password: password,
        redirect_uri: "https://s3-us-west-2.amazonaws.com/hm-registration/successsignin.html",
        token: "access",
      }),
      redirect: "manual",
    })

    // 获取location头并提取code
    const location = response.headers.get("Location")
    if (!location) {
      console.error("响应中没有location头")
      return { loginToken: null, userId: null }
    }

    const code = getCode(location)
    console.log(`账号 ${user} 成功获取code`)

    // 第二个请求获取登录令牌
    const loginUrl = "https://account.huami.com/v2/client/login"
    const loginResponse = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "MiFit/6.3.5 (iPhone; iOS 14.0.1; Scale/2.00)",
      },
      body: new URLSearchParams({
        app_name: "com.xiaomi.hm.health",
        app_version: "4.6.0",
        code: code,
        country_code: "CN",
        device_id: "2C8B4939-0CCD-4E94-8CBA-CB8EA6E613A1",
        device_model: "phone",
        grant_type: "access_token",
        third_name: user.match(/@(.*?)\.com/) ? "email" : "huami_phone",
      }),
    })

    const loginData = await loginResponse.json()
    const loginToken = loginData.token_info.login_token
    const userId = loginData.token_info.user_id

    console.log(`账号 ${user} 成功获取token`)
    return { loginToken, userId }
  } catch (error) {
    console.error("登录错误:", error)
    return { loginToken: null, userId: null }
  }
}

// 修改步数
export async function changeSteps(user: string, userId: string, appToken: string, step = "20000"): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0]

  const data_json =
    ""

  // 在data_json中替换日期和步数
  const findDate = /.*?date%22%3A%22(.*?)%22%2C%22data.*?/
  const findStep = /.*?ttl%5C%22%3A(.*?)%2C%5C%22dis.*?/

  let modifiedJson = data_json.replace(findDate.exec(data_json)![1], today)
  modifiedJson = modifiedJson.replace(findStep.exec(modifiedJson)![1], step)

  const url = `https://api-mifit-cn.huami.com/v1/data/band_data.json?&t=${getTimestamp()}`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apptoken: appToken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `userid=${userId}&last_sync_data_time=1597306380&device_type=0&last_deviceid=DA932FFFFE8816E7&data_json=${modifiedJson}`,
    })

    const data = await response.json()
    console.log(`账号 ${user}: 修改步数为 ${step} - ${data.message}`)
    
    // 验证API响应是否成功
    if (!response.ok || data.code !== 1 || data.message !== 'success') {
      console.error(`修改步数失败: ${data.message || "未知错误"}`)
      return false
    }
    
    return true
  } catch (error) {
    console.error("修改步数错误:", error)
    return false
  }
}

// 替代API用于步数修改
export async function sbsApiInfo(user: string, password: string, step: string): Promise<boolean> {
  const baseUrl = `https://apis.jxcxin.cn/api/mi?user=${user}&password=${password}&step=${step}`

  try {
    const response = await fetch(baseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:102.0) Gecko/20100101 Firefox/102.0",
        host: "apis.jxcxin.cn",
        Accept: "*/*",
      },
    })

    const data = await response.json()
    console.log(`账号: 修改步数为 ${step} - ${data.msg}`)
    
    // 检查API响应状态是否成功
    if (data.code !== 200 || !data.success) {
      console.error(`替代API返回错误: ${data.msg || '未知错误'}`)
      return false
    }
    
    return true
  } catch (error) {
    console.error("使用替代API错误:", error)
    return false
  }
}

// 处理账号的主函数
export async function processAccount(user: string, password: string, step: string): Promise<boolean> {
  // 先尝试主要方法
  const { loginToken, userId } = await login(user, password)

  if (!loginToken || !userId) {
    console.log("登录失败，尝试替代API")
    return await sbsApiInfo(user, password, step)
  }

  const appToken = await getAppToken(loginToken)
  if (!appToken) {
    console.log("获取应用令牌失败，尝试替代API")
    return await sbsApiInfo(user, password, step)
  }

  // 此时appToken一定是string类型
  return await changeSteps(user, userId, appToken, step)
}
