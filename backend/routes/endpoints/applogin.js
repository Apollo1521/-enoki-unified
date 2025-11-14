import { sign } from "../../dependencies/jwt_sign.js";
import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcrypt";

export default async function appLogin(req, res) {
  const { email, password } = req.body;

  if (!email.trim() || !password.trim()) {
    return res.status(400).json({
      code: "PARAMETERS_INCOMPLETE",
    });
  }

  try {
    const acct = await prisma.enokiAcct.findUnique({
      where: {
        email: email.trim(),
      },
      select: {
        id: true,
        teacherId: true,
        password: true,
      },
    });

    if (!acct || !acct.teacherId) {
      return res.status(400).json({
        code: "USER_NOT_FOUND",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, acct.password);

    if (acct.password === "") {
      // password is empty, new user
      console.log("REDIR");
      const { appToken } = sign({
        id: acct.id,
        rds: true,
      });

      return res.json({
        token: appToken,
      });
    }

    if (!isPasswordCorrect) {
      return res.status(400).json({
        code: "INVALID_CREDENTIALS",
      });
    }

    const { appToken } = sign({
      id: acct.id,
    });

    res.json({
      token: appToken,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      code: "SERVER_ERROR",
    });
  }
}
