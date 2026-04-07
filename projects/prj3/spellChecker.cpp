/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: march29
*/
#include "spellChecker.h"

#include <fstream>
#include <iomanip>

namespace seneca
{
    SpellChecker::SpellChecker(const char* filename)
    {
        std::ifstream file(filename);
        if (!file)
            throw "Bad file name!";

        for (int i = 0; i < 6; ++i)
        {
            file >> m_badWords[i] >> m_goodWords[i];
        }
    }

    void SpellChecker::operator()(std::string& text)
    {
        for (int i = 0; i < 6; ++i)
        {
            size_t pos = 0;
            while ((pos = text.find(m_badWords[i], pos)) != std::string::npos)
            {
                text.replace(pos, m_badWords[i].length(), m_goodWords[i]);
                pos += m_goodWords[i].length();
                ++m_count[i];
            }
        }
    }

    void SpellChecker::showStatistics(std::ostream& out) const
    {
        out << "Spellchecker Statistics\n";
        for (int i = 0; i < 6; ++i)
        {
            out << std::left<<std::setw(15) << m_badWords[i]
                << ": " << m_count[i] << " replacements" << std::endl;
        }
    }
}