package ggg;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import javax.servlet.http.*;

import org.apache.commons.fileupload.*;
import org.apache.commons.fileupload.servlet.*;
import org.apache.commons.io.IOUtils;



@SuppressWarnings("serial")
public class GggServlet extends HttpServlet {
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		HttpSession session = req.getSession(true);
		String str = (String)session.getAttribute("SGF");
		if (str.length()<=0) {
			resp.sendError(HttpServletResponse.SC_NOT_FOUND);
		} else {
			resp.setContentType("application/x-go-sgf");
			resp.setHeader("Content-Disposition", "attachment; filename=sgf.sgf");
			resp.getOutputStream().println(str);
		}
	}

	static final long serialVersionUID = 1;
	
	public void init() {
	}
	
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		HttpSession session = req.getSession(true);
		
		ServletFileUpload upload = new ServletFileUpload();
	    upload.setFileSizeMax(65535);
	    
	    FileItemIterator iterator;
		try {
			iterator = upload.getItemIterator(req);
  	        if (iterator.hasNext()) {
	            FileItemStream item = iterator.next();
	            InputStream stream = item.openStream();
	            String str = IOUtils.toString(stream, "UTF-8");
//	            resp.getWriter().println(str);
	            session.setAttribute("SGF", str);
	        }
		} catch (Exception e) {
			e.printStackTrace();
			resp.sendError(HttpServletResponse.SC_EXPECTATION_FAILED);
			resp.getWriter().println(e.getMessage());
			
		}
	}
}
