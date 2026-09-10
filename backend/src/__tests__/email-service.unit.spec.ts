import EmailService from "../services/email.service"

const mockSend = jest.fn()

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}))

describe("EmailService", () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      MEDUSA_STOREFRONT_URL: "https://store.example.com",
      RESEND_API_KEY: "re_test-api-key",
      RESEND_FROM: "Medusa Support <support@example.com>",
      RESEND_REPLY_TO: "help@example.com",
      EMAIL_WELCOME_BCC: "",
    }
    mockSend.mockResolvedValue({
      data: { id: "email_123" },
      error: null,
    })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("sends application-rendered email through Resend", async () => {
    const service = new EmailService()

    await expect(
      service.sendCustomerConfirmationEmail({
        to: "customer@example.com",
        customer: { first_name: "Ada" },
      })
    ).resolves.toBe(true)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Medusa Support <support@example.com>",
        to: "customer@example.com",
        replyTo: "help@example.com",
        subject: "Welcome to BNT Wholesale",
        html: expect.stringContaining("https://store.example.com/account"),
        text: expect.stringContaining("https://store.example.com/account"),
      })
    )
  })
})
