var router = require('express').Router();

function islogin(req,res,next){
    if(req.user){
        next()
    }else{
        res.send('로그인안함')
    }
}
router.use(islogin);
//router.use('/shirts',islogin);
router.get('/shirts', function(요청, 응답){
   응답.send('셔츠 파는 페이지입니다.');
});

router.get('/pants', function(요청, 응답){
   응답.send('바지 파는 페이지입니다.');
}); 



module.exports = router;