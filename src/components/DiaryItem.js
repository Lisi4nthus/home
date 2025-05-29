import { Link } from "react-router-dom";

const DiaryItem = ({ id, date, content }) => {
  return (
    <div style={styles.container}>
      <Link to={`/view/${id}`} style={styles.link}>
        <h4>{date}</h4>
        <p>{content.slice(0, 30)}...</p>
      </Link>
    </div>
  );
};

const styles = {
  container: {
    padding: "12px",
    marginBottom: "8px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    background: "#f9f9f9",
  },
  link: {
    textDecoration: "none",
    color: "inherit",
  },
};

export default DiaryItem;
