


import 'package:http/http.dart';
import 'dart:convert';
import 'package:intl/intl.dart';

class WorldTime {

  String location; // location name for UI
  late String time; // the time in that location
  String flag; // url to an asset flag icon
  String url; // location url for api endpoint
  late bool isDaytime; // true or false if daytime or not

  WorldTime({ required this.location, required this.flag, required this.url });

  Future<void> getTime() async {

    try{
      // make the request
      Response response = await get(Uri.parse('https://timeapi.io/api/Time/current/zone?timeZone=$url'));
      Map data = jsonDecode(response.body);

      // get properties from json (TimeAPI.io format)
      int year = data['year'];
      int month = data['month'];
      int day = data['day'];
      int hour = data['hour'];
      int minute = data['minute'];
      int seconds = data['seconds'];

      // create DateTime object
      DateTime now = DateTime(year, month, day, hour, minute, seconds);

      // set the time property
      isDaytime = now.hour > 6 && now.hour < 20 ? true : false;
      time = DateFormat.jm().format(now);
    }
    catch (e) {
      print(e);
      time = 'could not get time';
      isDaytime = true;
    }

  }

}