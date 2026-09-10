import {
  DEFAULT_LANDING_PAGE,
  LANDING_PAGE_METADATA_KEY,
  landingPageSchema,
  landingPageDraftSchema,
  readLandingPageState,
  updateLandingPageMetadata,
} from "../utils/landing-page-config";
import { GET as publicGet } from "../api/store/landing-page/route";
import { POST as adminPost } from "../api/admin/landing-page/route";

describe("landing page publishing", () => {
  const page = () => structuredClone(DEFAULT_LANDING_PAGE);

  it("ships a valid default layout without needing database setup", () => {
    expect(landingPageSchema.parse(page())).toEqual(page());
    expect(readLandingPageState(null).published).toEqual(page());
  });

  it("preserves the SIM card illustration through draft and publish validation", () => {
    const config = page();
    config.sections[1].cards[0].icon = "sim";
    expect(landingPageDraftSchema.parse(config).sections[1].cards[0].icon).toBe(
      "sim"
    );
    const saved = updateLandingPageMetadata(
      {},
      landingPageSchema.parse(config),
      "publish"
    );
    expect(
      readLandingPageState(saved).published.sections[1].cards[0].icon
    ).toBe("sim");
  });

  it("saves a draft without changing published content or unrelated store metadata", () => {
    const draft = page();
    draft.sections[0].title = "A private draft";
    const metadata = updateLandingPageMetadata(
      { merchant_setting: "keep" },
      draft,
      "save"
    );
    expect(metadata).toMatchObject({ merchant_setting: "keep" });
    const state = readLandingPageState(metadata);
    expect(state.draft.sections[0].title).toBe("A private draft");
    expect(state.published).toEqual(page());
    expect(state.published_at).toBeNull();
    expect(state.saved_at).not.toBeNull();
  });

  it("publishes section ordering and visibility, then keeps later drafts private", () => {
    const config = page();
    config.sections.reverse();
    config.sections[0].enabled = false;
    const metadata = updateLandingPageMetadata({}, config, "publish");
    const draft = page();
    const result = readLandingPageState(
      updateLandingPageMetadata(metadata, draft, "save")
    );
    expect(result.published.sections[0].id).toBe("discover");
    expect(result.published.sections[0].enabled).toBe(false);
    expect(result.published_at).not.toBeNull();
    expect(result.draft).toEqual(draft);
  });

  it("allows an unfinished product selection in drafts but not when publishing", () => {
    const config = page();
    config.sections[0].source = "selected";
    expect(landingPageDraftSchema.safeParse(config).success).toBe(true);
    expect(landingPageSchema.safeParse(config).success).toBe(false);
    expect(
      readLandingPageState(updateLandingPageMetadata({}, config, "save")).draft
    ).toEqual(config);
  });

  it.each([
    "javascript:alert(1)",
    "//evil.example",
    "/\\evil.example",
    "https://other.example",
    "/store\n",
  ])("rejects unsafe destination %s", (href) => {
    const config = page();
    config.sections[1].cards[0].href = href;
    expect(landingPageSchema.safeParse(config).success).toBe(false);
  });

  it("caps product requests and prevents duplicate section identities", () => {
    const config = page();
    config.sections[0].product_limit = 1000;
    expect(landingPageSchema.safeParse(config).success).toBe(false);
    config.sections[0].product_limit = 8;
    config.sections[1].id = config.sections[0].id;
    expect(landingPageSchema.safeParse(config).success).toBe(false);
  });

  it("rejects active content image URLs but allows merchant uploads", () => {
    const config = page();
    config.sections[1].cards[0].image_url = "data:image/svg+xml,<svg/>";
    expect(landingPageSchema.safeParse(config).success).toBe(false);
    config.sections[1].cards[0].image_url =
      "https://images.example.com/accessory.png";
    expect(landingPageSchema.safeParse(config).success).toBe(true);
  });

  it("never exposes drafts or unrelated metadata through the store endpoint", async () => {
    const published = page();
    published.sections[1].enabled = false;
    const draft = page();
    draft.sections[0].title = "Not public";
    const metadata = updateLandingPageMetadata(
      updateLandingPageMetadata(
        { private_setting: "secret" },
        published,
        "publish"
      ),
      draft,
      "save"
    );
    const req = {
      scope: { resolve: () => ({ listStores: async () => [{ metadata }] }) },
    };
    const res = { json: jest.fn() };
    await publicGet(req as any, res as any);
    const response = res.json.mock.calls[0][0];
    expect(Object.keys(response).sort()).toEqual(["config", "published_at"]);
    expect(response.config.sections).toHaveLength(1);
    expect(JSON.stringify(response)).not.toContain("Not public");
    expect(JSON.stringify(response)).not.toContain("private_setting");
  });

  it("adds starter banners to legacy layouts without replacing their sections", () => {
    const { banners, ...legacy } = page();
    legacy.sections[0].title = "Existing merchant content";
    const state = readLandingPageState({
      [LANDING_PAGE_METADATA_KEY]: { draft: legacy, published: legacy },
    });
    expect(state.published.sections[0].title).toBe("Existing merchant content");
    expect(state.published.banners).toEqual(banners);
    expect(state.draft.banners).toEqual(banners);
  });

  it("keeps banner edits private until publishing, including images, ordering and removal", async () => {
    const config = page();
    config.banners = [config.banners[2], config.banners[0]];
    config.banners[0].headline = "Our new campaign";
    config.banners[0].image_url = "https://merchant.example/banner.webp";
    config.banners[0].image_alt = "New accessories";
    config.banners[1].enabled = false;
    const draft = updateLandingPageMetadata({}, config, "save");
    expect(readLandingPageState(draft).published.banners).toEqual(
      page().banners
    );
    expect(readLandingPageState(draft).draft.banners).toEqual(config.banners);
    const published = updateLandingPageMetadata(draft, config, "publish");
    const req = {
      scope: {
        resolve: () => ({ listStores: async () => [{ metadata: published }] }),
      },
    };
    const res = { json: jest.fn() };
    await publicGet(req as any, res as any);
    expect(res.json.mock.calls[0][0].config.banners).toEqual([
      config.banners[0],
    ]);
  });

  it("allows deleting every banner without restoring the starter banners", () => {
    const config = page();
    config.banners = [];
    expect(landingPageSchema.safeParse(config).success).toBe(true);
    expect(
      readLandingPageState(updateLandingPageMetadata({}, config, "publish"))
        .published.banners
    ).toEqual([]);
  });

  it("allows unfinished banner copy in drafts but blocks publishing incomplete visible banners", () => {
    const config = page();
    config.banners[0].headline = "";
    config.banners[0].action = "";
    config.banners[0].link = "";
    expect(landingPageDraftSchema.safeParse(config).success).toBe(true);
    expect(landingPageSchema.safeParse(config).success).toBe(false);
    config.banners[0].enabled = false;
    expect(landingPageSchema.safeParse(config).success).toBe(true);
  });

  it("validates banner URLs, colors, identities and limits", () => {
    for (const patch of [
      { image_url: "javascript:alert(1)" },
      { link: "//untrusted.example" },
      { background: "url(https://untrusted.example)" },
    ]) {
      const config = page();
      Object.assign(config.banners[0], patch);
      expect(landingPageDraftSchema.safeParse(config).success).toBe(false);
      expect(landingPageSchema.safeParse(config).success).toBe(false);
    }
    const config = page();
    config.banners[1].id = config.banners[0].id;
    expect(landingPageSchema.safeParse(config).success).toBe(false);
    config.banners = Array.from({ length: 9 }, (_, index) => ({
      ...page().banners[0],
      id: `banner-${index}`,
    }));
    expect(landingPageSchema.safeParse(config).success).toBe(false);
  });

  it("reports the banner number for invalid publish requests without saving", async () => {
    const config = page();
    config.banners[1].headline = "";
    const resolve = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await adminPost(
      { body: { action: "publish", config }, scope: { resolve } } as any,
      res as any
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("Banner 2:"),
    });
    expect(resolve).not.toHaveBeenCalled();
  });

  it("validates writes before touching storage and persists valid publish requests", async () => {
    const service = {
      listStores: jest
        .fn()
        .mockResolvedValue([{ id: "store_test", metadata: { keep: true } }]),
      updateStores: jest.fn().mockResolvedValue({}),
    };
    const req = {
      scope: { resolve: () => service },
      body: { action: "publish", config: { sections: [] } },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await adminPost(req as any, res as any);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.listStores).not.toHaveBeenCalled();
    req.body.config = page() as any;
    await adminPost(req as any, res as any);
    expect(service.updateStores).toHaveBeenCalledWith("store_test", {
      metadata: expect.objectContaining({
        keep: true,
        [LANDING_PAGE_METADATA_KEY]: expect.objectContaining({
          published: page(),
        }),
      }),
    });
  });
});
