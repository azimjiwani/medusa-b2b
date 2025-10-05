"use client"

import { updateCustomer } from "@/lib/data/customer"
import Button from "@/modules/common/components/button"
import Input from "@/modules/common/components/input"
import { B2BCustomer } from "@/types/global"
import { HttpTypes } from "@medusajs/types"
import { Container, Text, clx, toast } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"

const ProfileCard = ({ customer }: { customer: B2BCustomer }) => {
  const router = useRouter()
  const t = useTranslations("account")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { first_name, last_name, phone } = customer

  const [customerData, setCustomerData] = useState({
    first_name: first_name || "",
    last_name: last_name || "",
    phone: phone || "",
  } as HttpTypes.StoreUpdateCustomer)

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true)
    try {
      const result = await updateCustomer(customerData)
  toast.success(t("profile.customerUpdatedSuccess"))
      setIsEditing(false)
      // Refresh the page to get the latest data
      router.refresh()
    } catch (error) {
  toast.error(t("profile.customerUpdatedError"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-fit">
      <Container className="p-0 overflow-hidden">
        <div
          className={clx(
            "grid grid-cols-2 gap-4 border-b border-neutral-200 overflow-hidden transition-all duration-300 ease-in-out",
            {
              "max-h-[244px] opacity-100 p-4": isEditing,
              "max-h-0 opacity-0": !isEditing,
            }
          )}
        >
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">{t("profile.firstName")}</Text>
            <Input
              label={t("profile.firstName")}
              name="first_name"
              value={customerData.first_name}
              onChange={(e) =>
                setCustomerData({
                  ...customerData,
                  first_name: e.target.value,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">{t("profile.lastName")}</Text>
            <Input
              label={t("profile.lastName")}
              name="last_name"
              value={customerData.last_name}
              onChange={(e) =>
                setCustomerData({
                  ...customerData,
                  last_name: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">{t("profile.email")}</Text>
            <Text className=" text-neutral-500">{customer.email}</Text>
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">{t("profile.phone")}</Text>
            <Input
              label={t("profile.phone")}
              name="phone"
              value={customerData.phone}
              onChange={(e) =>
                setCustomerData({ ...customerData, phone: e.target.value })
              }
            />
          </div>
        </div>
        <div
          className={clx(
            "grid grid-cols-2 gap-4 border-b border-neutral-200 transition-all duration-300 ease-in-out",
            {
              "opacity-0 max-h-0": isEditing,
              "opacity-100 max-h-[214px] p-4": !isEditing,
            }
          )}
        >
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">{t("profile.firstName")}</Text>
            <Text className=" text-neutral-500">
              {customerData.first_name || customer.first_name || t("profile.notSet")}
            </Text>
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">{t("profile.lastName")}</Text>
            <Text className=" text-neutral-500">
              {customerData.last_name || customer.last_name || t("profile.notSet")}
            </Text>
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">{t("profile.email")}</Text>
            <Text className=" text-neutral-500">{customer.email}</Text>
          </div>
          <div className="flex flex-col gap-y-2">
            <Text className="font-medium text-neutral-950">{t("profile.phone")}</Text>
            <Text className=" text-neutral-500">
              {customerData.phone || customer.phone || t("profile.notSet")}
            </Text>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 bg-neutral-50 p-4">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                {t("profile.cancel")}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave();
                }}
                isLoading={isSaving}
                disabled={isSaving}
              >
                {t("profile.save")}
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              {t("profile.edit")}
            </Button>
          )}
        </div>
      </Container>
    </div>
  )
}

export default ProfileCard
