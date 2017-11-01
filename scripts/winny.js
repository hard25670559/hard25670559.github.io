  function displayCar(data) {
    var x = document.getElementById('test');
    for (var i = 0; i < data.length; i++) {
      console.log(data[i]);
      var para=document.createElement("p");
      para.innerHTML=data[i];
      $(x).append(para);

    }
}