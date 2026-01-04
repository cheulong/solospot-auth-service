import { validate as isUuid } from "uuid";
import type { AuthService } from "../services/auth.type";

export const createAuthController = (authService: AuthService) => ({
  // @desc Create an account
  // @route POST /auth/register
  createAccount: async (req: any, res: any) => {
    const authData = req.body;
    const existingAccount = await authService.getAccountByEmail(authData.email);
    if (existingAccount) {
      return res.status(409).json({ message: "Account already exists" });
    }
    const newAccount = await authService.createAccount(authData);
    console.log("Created account:", newAccount);
    res.status(201).json(newAccount);
  },

  // @desc Login to an account
  // @route POST /auth/login
  login: async (req: any, res: any) => {
    const { email, password } = req.body;
    const existingAccount = await authService.getAccountByEmail(email);
    if (!existingAccount) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const account = await authService.login(email, password);
    if (!account) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const { email: accountEmail, accessToken, refreshToken } = account;
    res.cookie("refreshToken", refreshToken, { 
      httpOnly: true, 
      secure: true, // Use secure cookies in production
      sameSite: "none",  // Allow cross-site requests for refresh token
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/auth/refresh",
    });
    res.status(200).json({ message: "Login successful", email: accountEmail, accessToken, refreshToken });
  },

  refreshToken: async (req: any, res: any) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }
    try {
      const result = await authService.refreshToken(refreshToken);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ message: (error as Error).message });
    }
  },

  logout: async (req: any, res: any) => {
      const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.deleteRefreshToken(refreshToken);
      console.log("Refresh token deleted");
    } else {
      console.log("No refresh token found");
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/auth/refresh",
    });
    res.status(200).json({ message: "Logout successful" });
  },
  // // @desc Get all places
  // // @route GET /places
  // getPlaces: async (req: any, res: any) => {
  //   const places = await placeService.getAllPlaces();
  //   res.status(200).json(places);
  // },

  // // @desc Get a place by ID
  // // @route GET /places/:id
  // getPlaceById: async (req: any, res: any) => {
  //   const { id } = req.params;

  //   if (!isUuid(id)) {
  //     return res.status(400).json({ message: "Invalid place id" });
  //   }

  //   const place = await placeService.getPlaceById(id);

  //   if (!place) {
  //     return res.status(404).json({ message: "Place not found" });
  //   }
  //   res.status(200).json(place);
  // },

  // // @desc Update a place
  // // @route PUT /places/:id
  // updatePlace: async (req: any, res: any) => {
  //   const { id } = req.params;

  //   if (!isUuid(id)) {
  //     return res.status(400).json({ message: "Invalid place id" });
  //   }
  //   const newPlaceData = req.body;
  //   const place = await placeService.updatePlaceById(
  //     req.params.id,
  //     newPlaceData
  //   );
  //   if (!place) {
  //     return res.status(404).json({ message: "Place not found" });
  //   }
  //   res.status(200).json(place);
  // },

  // // @desc Delete a place
  // // @route DELETE /places/:id
  // deletePlace: async (req: any, res: any) => {
  //   const { id } = req.params;

  //   if (!isUuid(id)) {
  //     return res.status(400).json({ message: "Invalid place id" });
  //   }
  //   const deletePlaceResult = await placeService.deletePlaceById(req.params.id);
  //   if (!deletePlaceResult) {
  //     return res.status(404).json({ message: "Place not found" });
  //   }
  //   res.status(200).json({
  //     message: "Place deleted successfully",
  //     place: deletePlaceResult,
  //   });
  // },

  // // @desc Delete all places
  // // @route DELETE /places
  // deleteAllPlaces: async (req: any, res: any) => {
  //   await placeService.deleteAllPlaces();
  //   res.status(200).json({ message: "All places deleted successfully" });
  // },
});
