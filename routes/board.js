var router = require('express').Router();


router.get('/sport', function(요청, 응답){
   응답.send('sport.');
});

router.get('/game', function(요청, 응답){
   응답.send('game.');
}); 

module.exports = router;