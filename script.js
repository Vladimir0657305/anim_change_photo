const shader = {
    vertex: `  
#ifdef GL_ES
  precision mediump float;
  #endif

  // default mandatory variables
  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;

  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;

  // varyings : notice we've got 3 texture coords varyings
  // one for the displacement texture
  // one for our visible texture
  // and one for the upcoming texture
  varying vec3 vVertexPosition;
  varying vec2 vTextureCoord;
  varying vec2 vActiveTextureCoord;
  varying vec2 vNextTextureCoord;

  // textures matrices
  uniform mat4 activeTexMatrix;
  uniform mat4 nextTexMatrix;

  // custom uniforms
  uniform float uTransitionTimer;


  void main() {

    vec3 vertexPosition = aVertexPosition;

    gl_Position = uPMatrix * uMVMatrix * vec4(vertexPosition, 1.0);

    // varyings
    vTextureCoord = aTextureCoord;
    vActiveTextureCoord = (activeTexMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
			   	vNextTextureCoord = (nextTexMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
    vVertexPosition = vertexPosition;
  }`,
    fragment: ` 
#ifdef GL_ES
  precision mediump float;
  #endif

  varying vec3 vVertexPosition;
  varying vec2 vTextureCoord;
  varying vec2 vActiveTextureCoord;
  varying vec2 vNextTextureCoord;

  // custom uniforms
  uniform float uTransitionTimer;

  // our textures samplers
  // notice how it matches the sampler attributes of the textures we created dynamically
  uniform sampler2D activeTex;
  uniform sampler2D nextTex;
  uniform sampler2D displacement;

  void main( void ) {
            // our texture coords
            vec2 textureCoords = vec2(vTextureCoord.x, vTextureCoord.y);

  // our displacement texture
  vec4 displacementTexture = texture2D(displacement, textureCoords);

  // our displacement factor is a float varying from 1 to 0 based on the timer
    float displacementFactor = 1.0 - (cos(uTransitionTimer / (120.0 / 3.141592)) + 1.0) / 2.0;

    // the effect factor will tell which way we want to displace our pixels
    // the farther from the center of the videos, the stronger it will be
    vec2 effectFactor = vec2((textureCoords.x - 0.5) * 0.75, (textureCoords.y - 0.5) * 0.75);

    // calculate our displaced coordinates to our first video
    vec2 firstDisplacementCoords = vec2(vActiveTextureCoord.x - displacementFactor * (displacementTexture.r * effectFactor.x), vActiveTextureCoord.y- displacementFactor * (displacementTexture.r * effectFactor.y));
  
  vec4 firstDistortedColor = texture2D(activeTex, vec2(vActiveTextureCoord.x, firstDisplacementCoords.y));
  
    // opposite displacement effect on the second video
    vec2 secondDisplacementCoords = vec2(vNextTextureCoord.x - (1.0 - displacementFactor) * (displacementTexture.r * effectFactor.x), vNextTextureCoord.y - (1.0 - displacementFactor) * (displacementTexture.r * effectFactor.y));
  
  vec4 secondDistortedColor = texture2D(nextTex, vec2(vNextTextureCoord.x, secondDisplacementCoords.y));

  // mix both texture
  vec4 finalColor = mix(firstDistortedColor, secondDistortedColor, displacementFactor);

  // handling premultiplied alpha
  finalColor = vec4(finalColor.rgb * finalColor.a, finalColor.a);

  gl_FragColor = finalColor;
  }`
};

window.onload = function () {

    // set up our WebGL context and append the canvas to our wrapper
    var webGLCurtain = new Curtains("canvas");

    // disable drawing for now
    webGLCurtain.disableDrawing();

    // get our plane element
    var planeElements = document.getElementsByClassName("multi-textures");

    // here we will handle which texture is visible and the timer to transition between images
    var slider = {
        activeTexture: 1,
        nextTexture: 2, // this will change only when we will click
        maxTextures: planeElements[0].querySelectorAll("img").length - 1, // -1 because displacement image does not count
        transitionTimer: 0,
        isAnimating: false // flag to know if we are animating
    }

    // some basic parameters
    var params = {
        vertexShader: shader.vertex, // our vertex shader ID
        fragmentShader: shader.fragment, // our framgent shader ID
        alwaysDraw: true,
        uniforms: {
            transitionTimer: {
                name: "uTransitionTimer",
                type: "1f",
                value: 0,
            },
        },
    }

    var multiTexturesPlane = webGLCurtain.addPlane(planeElements[0], params);

    if (multiTexturesPlane) {
        // the idea here is to create two additionnal textures
        // the first one will contain our visible image
        // the second one will contain our entering (next) image
        // that we will deal with only activeTex and nextTex samplers in the fragment shader
        // and the could work with more images in the slideshow...
        var activeTex = multiTexturesPlane.createTexture("activeTex");
        var nextTex = multiTexturesPlane.createTexture("nextTex");

        multiTexturesPlane.onReady(function () {
            // we need to render the first frame
            webGLCurtain.needRender();

            // we set our very first image as the active texture
            activeTex.setSource(multiTexturesPlane.images[slider.activeTexture]);
            // we set the second image as next texture but this is not mandatory
            // as we will reset the next texture on slide change
            nextTex.setSource(multiTexturesPlane.images[slider.nextTexture]);

            // when our plane is ready we add a click event listener that will switch the active texture value

            // listen to the links click event
            var slideLinks = document.getElementsByClassName("change-slide");
            for (var i = 0; i < slideLinks.length; i++) {
                slideLinks[i].addEventListener("click", function () {
                    // get the index of the slide to go
                    var slideToGo = this.getAttribute("data-slide");
                    // if we are not animating
                    if (!slider.isAnimating) {
                        slider.nextTexture = slideToGo;
                        slider.isAnimating = true;
                        // enable drawing for now
                        webGLCurtain.enableDrawing();

                        // apply it to our next texture
                        nextTex.setSource(multiTexturesPlane.images[slider.nextTexture]);
                    }
                }, false);
            }

        }).onRender(function () {
            // handling the slideshow
            if (slider.isAnimating) {
                // increase timer
                slider.transitionTimer = Math.min(120, slider.transitionTimer + 1);
                // if time is up
                if (slider.transitionTimer >= 120) {
                    // stop animation
                    slider.isAnimating = false;
                    // disable drawing now that the transition is over
                    webGLCurtain.disableDrawing();
                    // update the active texture
                    slider.activeTexture = slider.nextTexture;
                    // our next texture becomes our active texture
                    activeTex.setSource(multiTexturesPlane.images[slider.activeTexture]);
                    // reset timer
                    slider.transitionTimer = 0;
                }
            }


            // update our transition timer uniform
            multiTexturesPlane.uniforms.transitionTimer.value = slider.transitionTimer;
        });
    }
}
