import React, { useState, useRef } from "react";
import { sendForm } from "@emailjs/browser";
import "../../css/Contact.css";
import contactImage from "../../images/endure.jpg";

const Contact = () => {
  const formRef = useRef();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    sendForm(
      "service_8wu5cjn",
      "template_1isnwvi",
      formRef.current,
      "zwFFz8di6JvdGIpeK"
    ).then(
      () => {
        setSent(true);
        setLoading(false);
        formRef.current.reset();
      },
      () => {
        setLoading(false);
      }
    );
  };

  return (
    <div className="contact-editorial">

      
      <div className="contact-topbar">
        <span>Studio</span>
        <span>Inquiries</span>
        <span>Press</span>
      </div>

      
      <div className="contact-heading">
        <h1>CONTACT</h1>
      </div>

      
      <div className="contact-grid">

        
        <div className="contact-image">
          <img src={contactImage} alt="Studio" />
        </div>

        
        <div className="contact-form-wrapper">
          <form ref={formRef} onSubmit={handleSubmit}>

            <input type="text" name="name" placeholder="Your Name" required />
            <input type="email" name="email" placeholder="Your Email" required />
            <textarea name="message" rows="6" placeholder="Your Message" required />

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>

          </form>

          {sent && (
            <p className="success-text">
              Your message has been sent successfully.
            </p>
          )}
        </div>

      </div>

    </div>
  );
};

export default Contact;
