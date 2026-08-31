THE CONFEDERATION PROBLEM — downloadable files
==============================================

Each file below is complete on its own. No folders, no installing, nothing
alongside it. Double-click to open in a browser.

  confederation-teacher.html   You. Also your projector view.
  confederation-student.html   The groups, two per laptop.
  confederation-solo.html      One student against twelve bots. Works with
                               no internet at all.

  teacher-run-of-show.pdf      Read this first. Minute by minute: what to press,
                               what to say, what will probably go wrong.
  teacher-run-of-show.html     The same guide, with a Print button.

  worksheet-student.pdf        Print two pages, front and back. One per group.
  worksheet-answer-key.pdf     The same sheet with suggested answers.
  confederation-worksheet.html The worksheet source, if you want to edit it.
                               Open it and press Print; the button in the
                               corner toggles the answer key.

RUNNING A CLASS
  1. Open the teacher file. Click "Create the session".
  2. Write the 4-letter code on the board.
  3. Groups open the student file and enter the code.
  4. You drive every step. Nothing moves without you clicking.

Teacher and student need internet (they talk to each other through your
Supabase project). The solo file does not.

IF YOU EMAIL THESE TO STUDENTS
  Gmail blocks .html attachments. Put them in Google Drive or Classroom
  instead, or host the folder and send a link.

REGENERATING THEM
  These are built from the source pages. After editing any content, run:
      node tools/build-standalone.js --all
