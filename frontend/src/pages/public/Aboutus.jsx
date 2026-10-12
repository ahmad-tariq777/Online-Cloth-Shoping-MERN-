import React from "react";
import "../../css/AboutUs.css";
import founderImage from "../../images/founder.png";
import materialsImage from "../../images/craft.png";
import designImage from "../../images/design.png";

const AboutUs = () => {
  return (
    <div className="about-editorial">

      
      <div className="about-topbar">
        <span>About</span>
        <span>Craft</span>
        <span>Philosophy</span>
      </div>

      
      <div className="about-heading">
        <h1>WARSAWSLOOK</h1>
      </div>

      
      <div className="about-grid">

        
        <div className="grid-item small">
          <img src={materialsImage} alt="Materials" />
          <p className="caption">
            Built on heritage and precision craftsmanship.
          </p>
        </div>

        
        <div className="grid-item large">
          <img src={founderImage} alt="Founder" />
        </div>

        
        <div className="grid-item small">
          <img src={designImage} alt="Design" />
          <p className="caption">
            Quiet luxury. Minimal expression. Timeless identity.
          </p>
        </div>

      </div>

      
      <div className="about-bottom-text">
        <p>
          We design garments that transcend seasons — crafted with intention,
          defined by restraint, and made to endure.
        </p>
      </div>

    </div>
  );
};

export default AboutUs;
