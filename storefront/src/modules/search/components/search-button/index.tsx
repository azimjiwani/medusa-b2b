"use client"

import { useState } from "react"
import { SearchModal } from "../search-modal"

const SearchIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
)

export function SearchButton() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full text-[#6e6e73] transition-colors hover:bg-[#e8e8ed] hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] small:w-52 small:justify-start small:bg-[#f5f5f7] small:px-4"
        onClick={() => setIsSearchOpen(true)}
        aria-label="Search"
        aria-haspopup="dialog"
        aria-expanded={isSearchOpen}
      >
        <SearchIcon />
        <span className="hidden text-[13px] small:inline">Search products</span>
      </button>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  )
}
