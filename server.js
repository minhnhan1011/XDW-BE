const Amadeus = require("amadeus");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql")
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
let confirmOrder = "";
app.use(bodyParser.json()); // support json encoded bodies
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET"],
    credentials: true
}));
app.use(express.json());
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "flightbao"
})
var amadeus = new Amadeus({
  clientId: "lZaaZR1oAC7AjFmSoxdFW48M5IjSM9Bl",
  clientSecret: "jplLBmg8EzFQing5"
});
const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ Message: "we need token please provide it." })
    }
    else {
        jwt.verify(token, "our-jsonwebtoken-secret-key", (err, decoded) => {
            if (err) {
                return res.json({ Message: "Authentication Error." })
            } else {
                req.name = decoded.name;
                next();
            }
        })
    }
}
app.get('/auth', verifyUser, function (req, res) {
    return res.json({ Status: "Success", name: req.name})
})
app.post('/login', function (req, res) {
    db.connect(function (err) {
        const sql = "SELECT * FROM khachhang where email = ? and matkhau = ?"
        db.query(sql, [req.body.email, req.body.password], function (err, data) {
            if (err) {
                return res.json({ Message: "Lỗi đăng nhập" })
            }
            if (data.length > 0) {
                const name = data[0].Tenkh;
                const token = jwt.sign({ name }, "our-jsonwebtoken-secret-key", { expiresIn: '1d' });
                res.cookie('token', token)
                return res.json({ Status: "Đăng nhập thành công" })
            } else {
                return res.json({ Message: "Tài khoản không tồn tại" })
            }
        })
    })
})
app.get('/logout', function (req, res) {
    res.clearCookie('token')
    return res.json({ Status: "Success" })
})
app.post('/signup', function(req,res){
    db.connect(function (err) {
        const values = [
            req.body.name,
            req.body.phone,
            req.body.email,
            req.body.password
        ]
        const sqlString = "INSERT INTO khachhang(Tenkh,sdt,email,matkhau) VALUES(?)";
        db.query(sqlString, [values], function (err, data) {
            if (err) {
                return res.json("error");
            } else {
                return res.json(data);
            }
        })

    })
})
app.post("/vekhuhoi", async function (req, res) {
    console.log(req.body);
    departure = req.body.ngaydi;
    arrival = req.body.ngayve;
    locationDeparture = req.body.diemdi;
    locationArrival = req.body.diemden;
    const response = await amadeus.shopping.flightOffersSearch
      .get({
        originLocationCode: locationDeparture,
        destinationLocationCode: locationArrival,
        departureDate: departure,
        returnDate: arrival,
        adults: "1",
        nonStop: true,
      })
      .catch((err) => console.log(err));
  
    try {
      await res.json(JSON.parse(response.body));
    } catch (err) {
      await res.json(err);
    }
  });
app.post("/vemotchieu", async function (req, res) {
    console.log(req.body);
    departure = req.body.ngaydi;
    locationDeparture = req.body.diemdi;
    locationArrival = req.body.diemden;
    const response = await amadeus.shopping.flightOffersSearch
      .get({
        originLocationCode: locationDeparture,
        destinationLocationCode: locationArrival,
        departureDate: departure,
        adults: "1",
        nonStop: true,
      })
      .catch((err) => console.log(err));
  
    try {
      await res.json(JSON.parse(response.body));
    } catch (err) {
      await res.json(err);
    }
  });
  app.post('/datve', function (req, res) {
    db.connect(function (err) {
        const values = [
            req.body.mamaybay,
            req.body.diemdi,
            req.body.diemden,
            req.body.ngaydi,
            req.body.ngayden,
            req.body.hanghangkhong,
            req.body.gia,
            req.body.ho,
            req.body.ten,
            req.body.email,
            req.body.sdt,
            req.body.dc,
        ]
        const sqlString = "INSERT INTO thongtinvemaybay(mamaybay,diemdi,diemden,ngaydi,ngayden,hanghangkhong,gia,ho,ten,email,sdt,dc) VALUES(?)";
        db.query(sqlString, [values], function (err, data) {
            if (err) {
                return res.json("error");
            } else {
                return res.json(data);
            }
        })

    })
})
// Route để lấy danh sách các tài khoản người dùng
app.get("/users", (req, res) => {
  const sql = "SELECT * FROM khachhang";
  db.query(sql, (err, data) => {
    if (err) {
      return res.json({ Message: "Lỗi khi lấy danh sách tài khoản." });
    } else {
      return res.json({ Status: "Success", users: data });
    }
  });
});
app.get("/ticket", (req, res) => {
  const sql = "SELECT * FROM thongtinvemaybay";
  db.query(sql, (err, data) => {
    if (err) {
      return res.json({ Message: "Lỗi khi lấy danh sách tài khoản." });
    } else {
      return res.json({ Status: "Success", users: data });
    }
  });
});
  app.listen(8081, () => {
    console.log("Howdy, I am running at PORT 8081");
  });
