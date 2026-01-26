import userService from "../services/userService.js";

// Function to set cookie
const setCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res.cookie("token", token, cookieOptions);
};

// User Registration
export const registerUser = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const result = await userService.registerUser({
      email,
      password,
      confirmPassword,
    });

    setCookie(res, result.token);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.user,
    });
  } catch (error) {
    if (
      error.message === "Passwords do not match" ||
      error.message === "User already exists with this email" ||
      error.message.includes("Password must")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// User login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email & password",
      });
    }

    const result = await userService.loginUser(email, password);

    setCookie(res, result.token);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result.user,
    });
  } catch (error) {
    if (error.message === "Invalid credentials") {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await userService.getCurrentUser(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Logout user
export const logoutUser = async (req, res) => {
  try {
    await userService.logoutUser();

    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
