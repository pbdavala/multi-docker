import React from "react";
import { Link } from "react-router-dom";

export default () => {
  return (
    <div>
      In some other page
      <Link to="/">Go back to home page!</Link>
    </div>
  );
};

/*
const OtherPage = () => {
  return (
    <div>
      Im some other page!
      <Link to="/">Go back home</Link>
    </div>
  );
};
export default OtherPage;
*/


